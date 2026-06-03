CREATE OR REPLACE FUNCTION complete_all_dailies(p_developer_id bigint)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_today       date := current_date;
  v_last_date   date;
  v_old_streak  int;
  v_new_streak  int;
  v_total       int;
  v_points      int;
BEGIN
  SELECT last_dailies_date, dailies_streak, dailies_completed, points
  INTO v_last_date, v_old_streak, v_total, v_points
  FROM developers
  WHERE id = p_developer_id
  FOR UPDATE;

  IF v_last_date = v_today THEN
    RETURN jsonb_build_object('already_completed', true, 'streak', v_old_streak, 'total', v_total);
  END IF;

  IF v_last_date = v_today - 1 THEN
    v_new_streak := v_old_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  v_total := v_total + 1;
  v_points := COALESCE(v_points, 0) + 15;

  UPDATE developers
  SET dailies_completed = v_total,
      dailies_streak = v_new_streak,
      last_dailies_date = v_today,
      points = v_points
  WHERE id = p_developer_id;

  RETURN jsonb_build_object(
    'already_completed', false,
    'streak', v_new_streak,
    'total', v_total,
    'points_granted', 15
  );
END;
$$;