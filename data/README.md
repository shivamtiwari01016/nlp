# Dataset

Download `customer_support_tickets.csv` from the [Kaggle Customer Support Ticket Dataset](https://www.kaggle.com/datasets/suraj520/customer-support-ticket-dataset) and place it in `data/raw/`.

The project was developed against the 8,469-row CSV export with 17 columns. The target column is `Ticket Type`, not a queue/category label. `ticket_triage.data` maps `Billing inquiry` and `Refund request` to Billing, `Technical issue` to Technical Support, `Cancellation request` to Account, and `Product inquiry` to General. These are inferred labels for this lab project; they are not original queue annotations. The raw export is ignored by Git.
