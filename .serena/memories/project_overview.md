# Donation Portal 概要
- Discordコミュニティ向け寄附受付サイト。Stripe Checkoutで単発/定期寄附を受け付け、同意した寄附者名のみDonorsページに表示する。
- Cloudflare Pages (静的フロント + Pages Functions) 上で動作。Pages FunctionsでCheckout開始、Stripe Webhook処理、Donors取得、Discord OAuthフローを提供。
- データの正はStripeをSSOTとし、Customer.metadataにdisplay_nameやconsent_publicなどを保存する。