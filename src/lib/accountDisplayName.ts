type UserMetadata = Record<string, unknown> | null | undefined;

function metadataText(metadata: UserMetadata, key: string): string {
  const value = metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

export function resolveAccountDisplayName(args: {
  profileDisplayName?: string | null;
  userMetadata?: UserMetadata;
  email?: string | null;
}): string {
  const profileName = args.profileDisplayName?.trim() ?? "";
  const email = args.email?.trim() ?? "";

  if (profileName && profileName.toLowerCase() !== email.toLowerCase()) {
    return profileName;
  }

  const metadataName =
    metadataText(args.userMetadata, "display_name") ||
    metadataText(args.userMetadata, "full_name") ||
    metadataText(args.userMetadata, "name");

  if (metadataName && metadataName.toLowerCase() !== email.toLowerCase()) {
    return metadataName;
  }

  if (email) {
    const localPart = email.split("@")[0]?.trim();
    if (localPart) return localPart;
  }

  return "Account";
}
