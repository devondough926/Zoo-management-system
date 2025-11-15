import { useState, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Save, X } from "lucide-react";

// Edit Exhibit Dialog Component
export function EditExhibitDialog({
  exhibit,
  isOpen,
  onOpenChange,
  onUpdate,
  onRemoveImage,
  locations,
  isSaving,
}) {
  const [formData, setFormData] = useState({
    name: exhibit?.exhibit_Name || "",
    description: exhibit?.exhibit_Description || "",
    capacity: exhibit?.Capacity?.toString() || "",
    displayTime: exhibit?.Display_Time || "",
    // New: exhibitType replaces the previous Location (zone) selector
    // Keep locationId in formData for backward compatibility, but default
    // to empty string when not provided.
    locationId: exhibit?.Location_ID?.toString() || "",
    // Also accept `Enclosure_Type` (existing data uses this key for many exhibits)
    exhibitType:
      exhibit?.Exhibit_Type || exhibit?.Type || exhibit?.Enclosure_Type || "",
    imageFile: null,
    removeImage: false,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [originalData, setOriginalData] = useState({});

  // Update form when exhibit changes
  useEffect(() => {
    if (exhibit) {
      const data = {
        name: exhibit.exhibit_Name || "",
        description: exhibit.exhibit_Description || "",
        capacity: exhibit.Capacity?.toString() || "",
        displayTime: exhibit.Display_Time || "",
        locationId: exhibit.Location_ID?.toString() || "",
        exhibitType:
          exhibit.Exhibit_Type || exhibit.Type || exhibit.Enclosure_Type || "",
        imageFile: null,
        removeImage: false,
      };
      setFormData(data);
      setOriginalData(data);
      setImagePreview(null);
    }
  }, [exhibit]);

  // Ensure exhibitType matches one of the allowed options (normalize casing/spacing)
  const EXHIBIT_TYPE_OPTIONS = [
    "Indoor",
    "Outdoor",
    "Hybrid",
    "Climate Controlled",
  ];

  // Normalize a raw stored value into one of the select options when possible.
  // Uses case-insensitive substring matching so values like "indoor exhibit",
  // "Indoor", "INDOOR", or "climate-controlled" will map correctly.
  function normalizeToOption(raw) {
    if (!raw) return "";
    const normalized = String(raw).trim().toLowerCase();
    if (!normalized) return "";

    // Try exact match first
    const exact = EXHIBIT_TYPE_OPTIONS.find(
      (opt) => opt.toLowerCase() === normalized
    );
    if (exact) return exact;

    // Try substring match: if the raw contains an option or option contains raw
    for (const opt of EXHIBIT_TYPE_OPTIONS) {
      const o = opt.toLowerCase();
      if (normalized.includes(o) || o.includes(normalized)) return opt;
    }

    // No match — return empty so the select shows placeholder rather than an unknown value
    return "";
  }

  // When exhibit prop changes, normalize the exhibitType into one of the select options
  useEffect(() => {
    if (exhibit) {
      const raw =
        exhibit.Exhibit_Type || exhibit.Type || exhibit.Enclosure_Type || "";
      const mapped = normalizeToOption(raw);
      setFormData((prev) => ({ ...prev, exhibitType: mapped }));
      setOriginalData((prev) => ({ ...prev, exhibitType: mapped }));
    }
  }, [exhibit]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, imageFile: file, removeImage: false });
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCurrentImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Mark image for removal - will be removed when user saves
    setFormData({ ...formData, removeImage: true, imageFile: null });
    setImagePreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  // Check if there are any changes
  const hasChanges = useMemo(() => {
    return (
      formData.name !== originalData.name ||
      formData.description !== originalData.description ||
      formData.capacity !== originalData.capacity ||
      formData.displayTime !== originalData.displayTime ||
      formData.locationId !== originalData.locationId ||
      formData.exhibitType !== originalData.exhibitType ||
      formData.imageFile !== null ||
      formData.removeImage
    );
  }, [formData, originalData]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Exhibit</DialogTitle>
          <DialogDescription>
            Update exhibit information for {exhibit?.exhibit_Name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="editExhibitName">Exhibit Name *</Label>
            <Input
              id="editExhibitName"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="editExhibitDescription">Description</Label>
            <textarea
              id="editExhibitDescription"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full h-24 px-3 py-2 border rounded-md"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editCapacity">Capacity</Label>
              <Input
                id="editCapacity"
                type="number"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="editDisplayTime">
                Display Time (24-hour format)
              </Label>
              <Input
                id="editDisplayTime"
                type="time"
                value={formData.displayTime}
                onChange={(e) =>
                  setFormData({ ...formData, displayTime: e.target.value })
                }
                placeholder="HH:MM"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="editExhibitType">Exhibit Type</Label>
            <Select
              value={formData.exhibitType}
              onValueChange={(value) =>
                setFormData({ ...formData, exhibitType: value })
              }
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder="Select exhibit type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Indoor">Indoor</SelectItem>
                <SelectItem value="Outdoor">Outdoor</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
                <SelectItem value="Climate Controlled">
                  Climate Controlled
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {exhibit?.Image_URL && !imagePreview && !formData.removeImage && (
            <div>
              <Label>Current Image</Label>
              <div className="flex items-center gap-3 mt-2">
                <img
                  src={exhibit.Image_URL}
                  alt={exhibit.exhibit_Name}
                  className="h-32 w-32 object-cover rounded border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-8 w-8 rounded-full p-0"
                  onClick={handleRemoveCurrentImage}
                  title="Remove image"
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="editExhibitImage">
              {exhibit?.Image_URL ? "Change Image" : "Add Image"}
            </Label>
            <Input
              id="editExhibitImage"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="cursor-pointer"
            />
            {imagePreview && (
              <div className="flex items-center gap-3 mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-8 w-8 rounded-full p-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setImagePreview(null);
                    setFormData({ ...formData, imageFile: null });
                    // Clear the file input
                    const fileInput =
                      document.getElementById("editExhibitImage");
                    if (fileInput) fileInput.value = "";
                  }}
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={!hasChanges || isSaving}
            className="w-full bg-teal-600 hover:bg-teal-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
