1. **Live Supabase Database Integration**
   - Run `npm install @supabase/ssr @supabase/supabase-js` using `run_in_bash_session`.
   - Create `lib/supabase/client.ts` and `lib/supabase/server.ts` using `write_file`.
   - Verify creation with `read_file`.
   - Edit `app/page.tsx` using `replace_with_git_merge_diff` to fetch the live metrics (beds, meals, invoices) for the Owner Dashboard, and real resident profile, room/bed info, and ledger for the Resident Portal.
   - Verify changes with `read_file`.

2. **Comprehensive Owner Actions (Admin Modals)**
   - Use `write_file` to create `components/admin/RoomAllocationModal.tsx` to handle bed assignments and call the `generate_cycle_invoice` RPC.
   - Use `write_file` to create `components/admin/PaymentVerificationPanel.tsx` to approve payments and update invoice status.
   - Use `write_file` to create `components/admin/SubMeterEntryModal.tsx` to capture sub-meter readings and apply `calculateElectricitySplit` logic, appending to `invoice_items`.
   - Verify component creation using `list_files` on `components/admin/` and `read_file` on the created files.
   - Update `app/page.tsx` using `replace_with_git_merge_diff` to integrate the admin modals. Verify with `read_file`.

3. **Real Gemini Flash Integration**
   - Use `run_in_bash_session` to install `@google/generative-ai`.
   - Use `replace_with_git_merge_diff` to replace the `extractMeterReading` mock in `lib/services/electricity-billing.ts` with real `GoogleGenerativeAI` implementation.
   - Verify the Gemini implementation using `read_file` on `lib/services/electricity-billing.ts`.

4. **WhatsApp Webhook Route**
   - Use `write_file` to implement `app/api/webhooks/whatsapp/route.ts` with `GET` and `POST` handlers.
   - Verify the webhook file creation and logic using `read_file` on `app/api/webhooks/whatsapp/route.ts`.

5. **Production Validation & Test Coverage**
   - Use `write_file` or `replace_with_git_merge_diff` to update test files:
     - `tests/billing-engine.test.ts`
     - `tests/gate-pass.test.ts`
     - `tests/electricity-billing.test.ts`
     - `tests/deposit-service.test.ts`
   - Use `run_in_bash_session` to execute `npx vitest run` and `npm run build` to verify tests and build. Verify outcomes.

6. **Pre-commit Steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

7. **Submit**
   - Submit changes.
