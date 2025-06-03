CREATE TABLE IF NOT EXISTS "orders" (
    "id" SERIAL NOT NULL,
    "clientName" character varying(50) NOT NULL,
    "plateId" integer,
    "beverageId" integer,
    "dessertId" integer,
    "isPaid" boolean NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_orders_id" PRIMARY KEY ("id"),
    CONSTRAINT "FK_orders_plate" FOREIGN KEY ("plateId") REFERENCES "plates"("id") ON DELETE SET NULL,
    CONSTRAINT "FK_orders_beverage" FOREIGN KEY ("beverageId") REFERENCES "beverages"("id") ON DELETE SET NULL,
    CONSTRAINT "FK_orders_dessert" FOREIGN KEY ("dessertId") REFERENCES "desserts"("id") ON DELETE SET NULL,
    CONSTRAINT "CHK_at_least_one_item" CHECK ("plateId" IS NOT NULL OR "beverageId" IS NOT NULL OR "dessertId" IS NOT NULL)
);
