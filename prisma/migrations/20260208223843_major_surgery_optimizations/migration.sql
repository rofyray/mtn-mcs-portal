-- CreateIndex
CREATE INDEX "AdminRegionAssignment_regionCode_idx" ON "AdminRegionAssignment"("regionCode");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "Feedback_partnerProfileId_idx" ON "Feedback"("partnerProfileId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "RestockRequest_partnerProfileId_idx" ON "RestockRequest"("partnerProfileId");

-- CreateIndex
CREATE INDEX "RestockRequest_businessId_idx" ON "RestockRequest"("businessId");

-- CreateIndex
CREATE INDEX "TrainingRequest_partnerProfileId_idx" ON "TrainingRequest"("partnerProfileId");
