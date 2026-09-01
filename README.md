# Reply Day

社内チャット「カイトチャット」に届いた依頼を、ローマ字で打ち返してゲーム内年収を伸ばすタイピングゲームです。

- リポジトリ: https://github.com/siryu810/typing-app
- UI の正本: [`mockups/final.html`](mockups/final.html)
- 仕様: [`docs/specs/mvp.md`](docs/specs/mvp.md)

## 必要もの

- [Nix](https://nixos.org/) と [direnv](https://direnv.net/)（このディレクトリで `direnv allow`）
- Vite+ CLI（`vp`）:

```bash
curl -fsSL https://vite.plus | bash
```

## ローカル起動

Linux 上のこのディレクトリで（`/mnt/c` は使わない）:

```bash
direnv allow          # 初回のみ。just / wrangler / vp を PATH に載せる
vp install            # 依存関係
just db-migrate       # ローカル D1 に migration
just db-seed          # 問題を投入
just dev              # http://localhost:5173
```

`just check` は `vp check && vp test && vp build` です。ESLint / Prettier は使いません。

## デプロイ

Cloudflare に未ログインのときは、先にブラウザ認証と本番 D1 作成が必要です。

```bash
cd /home/siryu/projects/typing-app
export PATH="$HOME/.local/share/vite-plus/bin:$PATH"

vp exec wrangler login
vp exec wrangler d1 create reply-day
```

`wrangler d1 create` が出力する `database_id` を `wrangler.jsonc` の `d1_databases[0].database_id` に書き換えてから:

```bash
just db-migrate-remote
just db-seed-remote
just deploy
```

公開 URL は `https://reply-day.<あなたのサブドメイン>.workers.dev` です。GitHub Actions は使いません。
