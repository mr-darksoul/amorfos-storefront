import { Badge } from "@amorfos/ui-kit";

export function AllVariants() {
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", padding: "1rem" }}>
      <Badge variant="default">5 Mukhi</Badge>
      <Badge variant="gold">Lab Certified</Badge>
      <Badge variant="dark">Nepal Origin</Badge>
      <Badge variant="rudra">Rudraksha</Badge>
    </div>
  );
}

export function CategoryChips() {
  const categories = ["Pendants", "Malas", "Combination", "Loose Beads"];
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", padding: "1rem" }}>
      {categories.map((c) => (
        <Badge key={c} variant="default">{c}</Badge>
      ))}
    </div>
  );
}

export function GoldLabels() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "1rem" }}>
      <Badge variant="gold">Lab Certified</Badge>
      <Badge variant="gold">Hand-Finished Silver</Badge>
      <Badge variant="gold">7-Day Returns</Badge>
    </div>
  );
}
