export function validateBackup(
  backup
) {
  //---------------------------------------

  if (!backup) {
    return {
      valid: false,
      error:
        "Backup file is empty.",
    };
  }

  //---------------------------------------

  if (
    backup.app !==
    "Momentry"
  ) {
    return {
      valid: false,
      error:
        "This is not a Momentry backup.",
    };
  }

  //---------------------------------------

  if (
    !Array.isArray(
      backup.moments
    )
  ) {
    return {
      valid: false,
      error:
        "Backup is missing memories.",
    };
  }

  //---------------------------------------

  return {
    valid: true,
  };
}