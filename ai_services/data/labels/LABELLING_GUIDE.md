# Labelling Guide

Open `gold_review_labels.csv` and fill the blank `human_label` column for all rows. These reviews are the M1 test set, so judge each one yourself. `llm_label` is only a suggestion. Do not edit other columns.

| Label | Use when |
|---|---|
| `debited_not_fulfilled` | Money was taken but the order or service never came |
| `payment_pending` | Payment is stuck or processing |
| `payment_failed_or_declined` | Payment failed, and no money is said to be lost |
| `refund_or_reversal_status` | Waiting for or asking about a refund |
| `double_or_unrecognised_charge` | Charged twice, or an unexpected charge |
| `delivery_delay` | Late delivery, rider or tracking problems |
| `price_complaint` | Prices or fees are too high, with no payment fault |
| `food_quality` | Food is cold, wrong, missing or poor |
| `app_bug_other` | App faults not about payment |
| `praise_or_neutral` | Praise, thanks, or no complaint |

If a review fits two labels, choose the one the customer most needs fixed. "Order never came and no refund" is `debited_not_fulfilled`. "Order was cancelled, where is my refund" is `refund_or_reversal_status`.

Then run `python -m ai_services.scripts.train_m1` from the repository root to produce the real test scores.
