# プロジェクト概要

# 

# \*\*SchoolScheduleSharing（せいと手帳）\*\*は、ReactベースのWebアプリケーションで、学校の課題やテストのスケジュールを管理するためのものです。このアプリケーションは、Supabaseをバックエンドとして使用しています。

# 

# 開発用コマンド一覧

# 

# \# 開発サーバーを起動（Viteを使用）

# npm start

# 

# \# 本番用にビルド（TypeScriptのコンパイル + Viteによるビルド）

# npm run build

# 

# \# テストを実行

# npm test

# 

# \# react-scriptsからの分離（不可逆操作）

# npm run eject

# 

# 🖥️ サーバー起動方法を詳しく解説

# 

# 1\. 依存パッケージのインストール

# 

# 前提としてNode.jsをインストールしておきます。

# まず、プロジェクトのルートディレクトリで以下を実行して、必要なパッケージをインストールします：

# 

# npm install

# 

# これにより、package.json に記載された依存関係がすべて node\_modules にインストールされます。

# 

# 2\. 開発サーバーの起動

# 

# npm start

# 

# このコマンドは、Viteを使ってローカル開発サーバーを起動します。通常、以下のようなURLでアプリが起動します：

# 

# http://localhost:5173

# 

# ブラウザでこのURLにアクセスすれば、開発中のアプリを確認できます。

# 

# 3\. Supabaseとの接続確認

# 

# .env ファイルに Supabase のURLやAPIキーが正しく設定されているか確認してください。 例：

# 

# VITE\_SUPABASE\_URL=https://your-project.supabase.co

# VITE\_SUPABASE\_ANON\_KEY=your-anon-key





