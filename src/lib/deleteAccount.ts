import { supabase } from "@/integrations/supabase/client";

const BUCKET = "wardrobe-images";

async function listAllPaths(folder: string): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list(folder, {
      limit: 100,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const entry of data) {
      const fullPath = `${folder}/${entry.name}`;
      if (entry.id) {
        paths.push(fullPath);
      } else {
        paths.push(...(await listAllPaths(fullPath)));
      }
    }

    if (data.length < 100) break;
    offset += data.length;
  }

  return paths;
}

export async function deleteCurrentAccount(): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("You must be signed in to delete your account.");

  const storagePaths = await listAllPaths(userData.user.id);
  for (let index = 0; index < storagePaths.length; index += 100) {
    const batch = storagePaths.slice(index, index + 100);
    const { error } = await supabase.storage.from(BUCKET).remove(batch);
    if (error) throw error;
  }

  const { error: deleteError } = await supabase.rpc("delete_my_account");
  if (deleteError) throw deleteError;

  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // The auth row has already been deleted, so local cleanup is best-effort.
  }
}
