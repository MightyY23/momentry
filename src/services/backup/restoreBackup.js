import { validateBackup } from "./validateBackup";

//---------------------------------------

export async function restoreBackup(
  file
) {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = () => {
        try {
          const backup =
            JSON.parse(
              reader.result
            );

          //---------------------------------------

          const validation =
            validateBackup(
              backup
            );

          if (
            !validation.valid
          ) {
            reject(
              validation.error
            );

            return;
          }

          //---------------------------------------

          resolve(backup);
        } catch (err) {
          reject(
            "Invalid backup file."
          );
        }
      };

      reader.onerror = () =>
        reject(
          "Unable to read file."
        );

      reader.readAsText(file);
    }
  );
}