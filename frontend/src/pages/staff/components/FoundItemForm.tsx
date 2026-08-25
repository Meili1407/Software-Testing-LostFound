import { LostItemForm } from "../../report-lost/components/LostItemForm";

/** Staff-side found-item intake — reuses the same form as the student lost-item report,
 *  since both submit to the same POST /reports endpoint and differ only in reportType. */
export function FoundItemForm() {
  return <LostItemForm reportType="FOUND" />;
}
