import { Button, ArrowIcon } from "@amorfos/ui-kit";

export function Primary() {
  return <Button variant="primary">Discover the Collection</Button>;
}

export function Outline() {
  return <Button variant="outline">Learn More</Button>;
}

export function WithIcon() {
  return (
    <Button variant="primary">
      Shop Now <ArrowIcon style={{ width: 16, height: 16 }} />
    </Button>
  );
}

export function Disabled() {
  return (
    <Button variant="primary" disabled>
      Processing…
    </Button>
  );
}

export function AsAnchor() {
  return (
    <Button as="a" href="#" variant="outline">
      View all Malas
    </Button>
  );
}
