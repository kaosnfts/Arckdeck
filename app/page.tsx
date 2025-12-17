import { HubApp } from "@/components/hubApp";
import { EntryGate } from "@/components/entryGate";

export default function Page() {
  return (
    <EntryGate>
      <HubApp />
    </EntryGate>
  );
}
