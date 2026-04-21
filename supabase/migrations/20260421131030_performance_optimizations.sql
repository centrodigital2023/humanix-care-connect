-- =============================================================================
-- Performance optimizations: missing indexes + semantic search RPC
-- =============================================================================

-- -----------------------------------------------------------------------
-- 1. Missing indexes on high-traffic tables
-- -----------------------------------------------------------------------

-- applications: professional_id is used in RLS policies and dashboard queries
CREATE INDEX IF NOT EXISTS idx_applications_professional
  ON public.applications(professional_id);

-- applications: job_offer_id is used in RLS policies for offer owners
CREATE INDEX IF NOT EXISTS idx_applications_offer
  ON public.applications(job_offer_id);

-- ratings: rated_user_id is scanned on every INSERT/UPDATE/DELETE
--          by the refresh_pro_avg_rating trigger
CREATE INDEX IF NOT EXISTS idx_ratings_rated_user
  ON public.ratings(rated_user_id);

-- professional_documents: user_id is the primary filter for all document queries
CREATE INDEX IF NOT EXISTS idx_professional_documents_user
  ON public.professional_documents(user_id);

-- professional_references: user_id is the primary filter
CREATE INDEX IF NOT EXISTS idx_professional_references_user
  ON public.professional_references(user_id);

-- professional_profiles: partial index for the main marketplace search:
--   active=true rows ordered by avg_rating DESC (covers the ORDER BY + WHERE)
CREATE INDEX IF NOT EXISTS idx_pro_active_rating
  ON public.professional_profiles(avg_rating DESC)
  WHERE active = true;

-- professional_profiles: partial index for verified filter used in marketplace
CREATE INDEX IF NOT EXISTS idx_pro_verified
  ON public.professional_profiles(verified)
  WHERE verified = true;

-- fraud_flags: composite index on (user_id, created_at) — used in superadmin
--   fraud dashboard to list all flags for a given user ordered by recency
CREATE INDEX IF NOT EXISTS idx_fraud_flags_user_created
  ON public.fraud_flags(user_id, created_at DESC);

-- fraud_flags: partial index for open (unresolved) flags — hot path for
--   admin review queues
CREATE INDEX IF NOT EXISTS idx_fraud_flags_open
  ON public.fraud_flags(severity, created_at DESC)
  WHERE resolved = false;

-- notifications: partial index for unread notifications — the hot path is
--   "show unread count / list for user" which always filters read_at IS NULL
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

-- -----------------------------------------------------------------------
-- 2. Refresh avg-rating trigger: re-declared to ensure it uses the new
--    idx_ratings_rated_user index added above.
--    Fires on every INSERT/UPDATE/DELETE on public.ratings and recalculates
--    the avg_rating field on the related professional_profiles row.
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_pro_avg_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target_user_id UUID;
BEGIN
  target_user_id := COALESCE(NEW.rated_user_id, OLD.rated_user_id);
  UPDATE public.professional_profiles
  SET avg_rating = COALESCE((
      SELECT ROUND(AVG(stars)::numeric, 2)
      FROM public.ratings
      WHERE rated_user_id = target_user_id   -- uses idx_ratings_rated_user
    ), 0)
  WHERE user_id = target_user_id;
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------
-- 3. RPC: match_professionals_for_text
--
--    Purpose: full server-side semantic search for the text-to-pros flow.
--    Called by the semantic-match edge function when mode="text-to-pros".
--
--    Input:  _embedding      – a pre-computed text-embedding-004 vector
--                              (768 dimensions) passed as double precision[]
--                              and cast to pgvector internally.
--            _match_count    – maximum number of results (default 10).
--            _min_similarity – cosine similarity floor; 0.45 is the same
--                              default used for offer-to-pros matching and
--                              represents "meaningfully related" content
--                              while excluding noise.
--    Output: (user_id, similarity) pairs ordered by similarity DESC.
--
--    Performance: uses the IVF index (profile_embeddings_ivf) that was
--    created in migration 20260417144142.  The JOIN on professional_profiles
--    filters out inactive professionals before the KNN search result set
--    is materialised.
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.match_professionals_for_text(
  _embedding      double precision[],
  _match_count    INTEGER DEFAULT 10,
  _min_similarity FLOAT   DEFAULT 0.45
)
RETURNS TABLE (user_id UUID, similarity FLOAT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT  pe.user_id,
          (1 - (pe.embedding <=> _embedding::vector))::FLOAT AS similarity
  FROM    public.profile_embeddings pe
  JOIN    public.professional_profiles pp
            ON  pp.user_id = pe.user_id
            AND pp.active  = true
  WHERE   (1 - (pe.embedding <=> _embedding::vector)) >= _min_similarity
  ORDER BY pe.embedding <=> _embedding::vector ASC   -- ascending distance = descending similarity
  LIMIT   _match_count;
$$;
