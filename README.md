# NOËL — Christmas landing

Static, mobile-first landing page with a Vercel Serverless Function for leads.

## Run locally

Install the [Vercel CLI](https://vercel.com/docs/cli), then run `vercel dev` in this directory. This serves the static page and `/api/order` together. For a static preview, any local web server will work, but form delivery requires Vercel Dev or a Vercel deployment.

## Edit storefront data

Public business values live in `config.js`; page copy and media locations are in `index.html`. Product photos and the video live in `img_and_video/`.

## Connect lead delivery

1. Copy `.env.example` to `.env.local` and fill in the values; do not commit that file.
2. For Telegram, create a bot, start a chat with it, and set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
3. For Google Forms, set its `formResponse` URL and its name/phone `entry.*` identifiers. Alternatively, publish a Google Apps Script Web App and set `GOOGLE_APPS_SCRIPT_URL`; it receives the same JSON payload.
4. Add those environment variables in Vercel before deployment. The form deliberately reports an error if no receiver is configured or a receiver fails.

## Analytics

The client preserves UTM and common ad click IDs with each lead. Add Meta Pixel, TikTok Pixel or GA4 only after configuring their IDs and consent flow. Trigger `Lead` only after `/api/order` responds successfully.

## Deploy

Import this directory into Vercel, add the variables above in Project Settings → Environment Variables, then deploy. Vercel automatically exposes `api/order.js` as `/api/order`.
# noelRepo
