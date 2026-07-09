import { supabase } from "../supabase/supabaseClient";

export async function uploadImage(file) {
  if (!file) {
    throw new Error("No image selected.");
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("moment-images")
    .upload(fileName, file);

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage
    .from("moment-images")
    .getPublicUrl(fileName);

  return publicUrl;
}