# Donation Portal 概要
- Discordコミュニティ向け寄付受付サイト。Stripe Checkoutで単発/定期寄付を受け付け、同意した寄付者名のみDonorsページに表示する。
- Cloudflare Pages (静的フロント + Pages Functions) 上で動作。Pages FunctionsでCheckout開始、Stripe Webhook処理、Donors取得、Discord OAuthフローを提供。
- データの正はStripeをSSOTとし、Customer.metadataにdisplay_nameやconsent_publicなどを保存する。