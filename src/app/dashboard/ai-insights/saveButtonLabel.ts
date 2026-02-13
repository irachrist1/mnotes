export function getSaveButtonLabel(args: {
  isSaved: boolean;
  isSaving: boolean;
  isNearDuplicate: boolean;
}): string {
  if (args.isSaved) return "Saved";
  if (args.isSaving) return "Saving...";
  if (args.isNearDuplicate) return "Similar exists";
  return "Save";
}

