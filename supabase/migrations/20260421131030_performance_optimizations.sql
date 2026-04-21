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

-- professional_profiles: composite partial index for the main marketplace
--   search (active=true ordered by avg_rating DESC)
CREATE INDEX IF NOT EXISTS idx_pro_active_rating
  ON public.professional_profiles(avg_rating DESC)
  WHERE active = true;

-- professional_profiles: verified filter used in marketplace searches
CREATE INDEX IF NOT EXISTS idx_pro_verified
  ON public.professional_profiles(verified)
  WHERE verified = true;

-- fraud_flags: user_id + resolved status — used in superadmin fraud dashboard
CREATE INDEX IF NOT EXISTS idx_fraud_flags_user
  ON public.fraud_flags(user_id, created_at DESC);

-- fraud_flags: partial index for open (unresolved) flags
CREATE INDEX IF NOT EXISTS idx_fraud_flags_open
  ON public.fraud_flags(severity, created_at DESC)
  WHERE resolved = false;

-- notifications: partial index for unread — the hot path is
--   "show unread count / list for user"
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

-- -----------------------------------------------------------------------
-- 2. Optimise the search path for the existing avg-rating trigger.
--    The trigger already fires on every rating change; make sure the
--    underlying SELECT uses the index we just added.
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_pro_avg_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid UUID;
BEGIN
  v_uid := COALESCE(NEW.rated_user_id, OLD.rated_user_id);
  UPDATE public.professional_profiles
  SET avg_rating = COALESCE((
      SELECT ROUND(AVG(stars)::numeric, 2)
      FROM public.ratings
      WHERE rated_user_id = v_uid   -- uses idx_ratings_rated_user
    ), 0)
  WHERE user_id = v_uid;
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------
-- 3. RPC: match_professionals_for_text
--    Replaces the in-JavaScript cosine-similarity loop in the
--    semantic-match edge function (text-to-pros mode).
--    Input: a pre-computed 768-dimensional embedding vector.
--    Returns the top-N professionals by cosine similarity using pgvector.
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.match_professionals_for_text(
  _embedding   vector(768),
  _match_count INTEGER DEFAULT 10,
  _min_similarity FLOAT  DEFAULT 0.45
)
RETURNS TABLE (user_id UUID, similarity FLOAT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT  pe.user_id,
          (1 - (pe.embedding <=> _embedding))::FLOAT AS similarity
  FROM    public.profile_embeddings pe
  JOIN    public.professional_profiles pp
            ON pp.user_id = pe.user_id
           AND pp.active  = true
  WHERE   (1 - (pe.embedding <=> _embedding)) >= _min_similarity
  ORDER BY pe.embedding <=> _embedding ASC   -- ascending distance = descending similarity
  LIMIT   _match_count;
$$;
