UPDATE "Admin"
SET "email" = lower(trim("email"))
WHERE "email" <> lower(trim("email"));

ALTER TABLE "Admin"
ADD CONSTRAINT "Admin_email_lowercase_check"
CHECK ("email" = lower(trim("email")));
