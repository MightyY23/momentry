-- ==========================================
-- STORAGE POLICIES for moment-images
--
-- The bucket already exists (public, 5 MB
-- limit). The live project has:
--   * "Allow public read"  (SELECT, public)
--   * "Allow authenticated uploads" (INSERT)
--
-- Missing: UPDATE + DELETE. Without a
-- DELETE policy, removing a memory cannot
-- delete its image — this migration adds
-- scoped update/delete policies without
-- touching the existing ones.
-- ==========================================

-- ------------------------------------------
-- Scoped UPDATE: only within your own
-- user folder moment-images/<uid>/...
-- ------------------------------------------

do $$
declare
    v_count int;
begin
    select count(*) into v_count from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'moment_images_update_own_folder';

    if v_count = 0 then
        create policy "moment_images_update_own_folder"
            on storage.objects
            for update to authenticated
            using (
                bucket_id = 'moment-images'
                and (storage.foldername(name))[1] = auth.uid()::text
            );
    end if;
end
$$;

-- ------------------------------------------
-- Scoped DELETE: only within your own
-- user folder moment-images/<uid>/...
-- Fixes: deleting a memory fails to remove
-- its image when no DELETE policy exists.
-- ------------------------------------------

do $$
declare
    v_count int;
begin
    select count(*) into v_count from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'moment_images_delete_own_folder';

    if v_count = 0 then
        create policy "moment_images_delete_own_folder"
            on storage.objects
            for delete to authenticated
            using (
                bucket_id = 'moment-images'
                and (storage.foldername(name))[1] = auth.uid()::text
            );
    end if;
end
$$;
