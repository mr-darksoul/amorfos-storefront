import { WhatsAppButton } from "@amorfos/ui-kit";

export function Default() {
  return (
    <div style={{ padding: "2rem", display: "flex", justifyContent: "flex-end" }}>
      <WhatsAppButton phone="+918368469332" />
    </div>
  );
}

export function CustomMessage() {
  return (
    <div style={{ padding: "2rem", display: "flex", justifyContent: "flex-end" }}>
      <WhatsAppButton
        phone="+918368469332"
        message="Hello Amorfos — I'd like to know more about the 7 Mukhi pendant."
      />
    </div>
  );
}
