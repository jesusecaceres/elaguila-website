# Ofertas Staging Certification Runbook

Package 9 does not perform these steps. This runbook defines the future controlled staging order and evidence required.

For each step, record prerequisite, action, expected database evidence, expected API evidence, expected UI evidence, failure behavior, rollback/retry, and screenshots/log evidence.

1. Readiness endpoint.
2. Schema verification.
3. Owner authentication.
4. Flyer draft creation.
5. Flyer source upload.
6. Gemini scan.
7. Page progress.
8. Decimal-price correction.
9. Bounding-box/crop review.
10. Preview.
11. Stripe flyer checkout.
12. Webhook fulfillment.
13. Submission.
14. Admin approval.
15. Public flyer.
16. Product search.
17. Drawer/page highlight.
18. Shopping list.
19. Coupon upload/scan/review.
20. Coupon checkout.
21. Coupon approval/public detail.
22. Verify no cart/list.
23. Partner courtesy flow.
24. Replacement flow.
25. Renewal flow.
26. Scheduled activation.
27. Cleanup worker.
28. Notification outbox.
29. Expiration enforcement.
30. Analytics owner/admin truth.
31. ES/EN.
32. Focused mobile.

Stop immediately on schema mismatch, payment mismatch, provider constraint mismatch, unauthorized worker access, leaked secret, public stale listing, or any production hostname/credential evidence.
