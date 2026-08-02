//---------------------------------------
// Convert URL to Base64
//---------------------------------------

export async function imageToBase64(
  imageUrl
) {
  try {
    const response = await fetch(
      imageUrl
    );

    const blob =
      await response.blob();

    return await new Promise(
      (resolve) => {
        const reader =
          new FileReader();

        reader.onloadend = () =>
          resolve(reader.result);

        reader.readAsDataURL(blob);
      }
    );
  } catch (err) {
    console.error(err);

    return null;
  }
}