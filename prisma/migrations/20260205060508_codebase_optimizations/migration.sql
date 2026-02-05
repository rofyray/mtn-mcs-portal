-- CreateIndex
CREATE INDEX "Agent_partnerProfileId_idx" ON "Agent"("partnerProfileId");

-- CreateIndex
CREATE INDEX "Agent_status_idx" ON "Agent"("status");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Business_partnerProfileId_idx" ON "Business"("partnerProfileId");

-- CreateIndex
CREATE INDEX "Business_status_idx" ON "Business"("status");

-- CreateIndex
CREATE INDEX "Business_addressRegionCode_idx" ON "Business"("addressRegionCode");

-- CreateIndex
CREATE INDEX "FormRequest_partnerProfileId_idx" ON "FormRequest"("partnerProfileId");

-- CreateIndex
CREATE INDEX "FormRequest_status_idx" ON "FormRequest"("status");

-- CreateIndex
CREATE INDEX "Notification_recipientAdminId_idx" ON "Notification"("recipientAdminId");

-- CreateIndex
CREATE INDEX "Notification_recipientUserId_idx" ON "Notification"("recipientUserId");

-- CreateIndex
CREATE INDEX "Notification_recipientType_recipientAdminId_readAt_idx" ON "Notification"("recipientType", "recipientAdminId", "readAt");

-- CreateIndex
CREATE INDEX "PartnerProfile_status_idx" ON "PartnerProfile"("status");
