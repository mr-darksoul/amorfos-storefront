-- Browser details captured at checkout (IP, user agent, Meta _fbp/_fbc cookies,
-- page URL) so a payment confirmed by the Razorpay webhook — which carries no
-- browser context — can still send a well-matched Meta Conversions API event.
alter table orders add column if not exists client_context jsonb;
