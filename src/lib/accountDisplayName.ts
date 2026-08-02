type UserMetadata = Record<string, unknown> | null | undefined;

function metadataText(metadata: UserMetadata, key: string): string {
  const value = metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

export function resolveAccountDisplayName(args: {
  profileDisplayName?: string | null;
  userMetadata?: UserMetadata;
  email?: string | null;
}): string {
  const profileName = args.profileDisplayName?.trim() ?? "";
  const email = args.email?.trim() ?? "";
  const emailLocalPart = email.split("@")[0]?.trim() ?? "";

  const metadataName =
    metadataText(args.userMetadata, "display_name") ||
    metadataText(args.userMetadata, "full_name") ||
    metadataText(args.userMetadata, "name");

  const genericProfileNames = new Set([
    "user",
    "account",
    normalized(email),
    normalized(emailLocalPart),
  ]);

  if (profileName && !genericProfileNames.has(normalized(profileName))) {
    return profileName;
  }

  if (metadataName && normalized(metadataName) !== normalized(email)) {
    return metadataName;
  }

  if (profileName && normalized(profileName) !== normalized(email)) {
    return profileName;
  }

  return emailLocalPart || "Account";
}
