import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import PresetList from "./preset-list";
import loopediaLogo from "@/assets/loopedia-logo.png";
import { motion } from "framer-motion";

export default function LandingPage() {
  const [guestMode, setGuestMode] = useState(false);
  const [_, navigate] = useLocation();

  // ユーザー認証状態をチェック（念のため）
  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  // ユーザーが存在するかチェック（型安全に処理）
  const isAuthenticated = !!user;

  // すでにログインしている場合はタイムラインにリダイレクト
  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  // ゲストモードが有効になっている場合、プリセットリストを表示（ログインボタンは1つだけ表示）
  if (guestMode) {
    return (
      <div className="relative">
        {/* ゲストモードバナー */}
        <div className="sticky top-0 z-10 bg-amber-50 border-b border-amber-200 shadow-sm p-3 text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6">
            <p className="text-amber-800 font-medium">
              ゲストモードでは閲覧のみ可能です。すべての機能を利用するには登録してください。
            </p>
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="default" size="sm">
                  ログイン
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGuestMode(false)}
              >
                トップに戻る
              </Button>
            </div>
          </div>
        </div>

        {/* プリセットリスト */}
        <PresetList guestMode={true} hideLoginButtons={true} />
      </div>
    );
  }

  // ランディングページのデフォルト表示
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 overflow-hidden">
      {/* ヒーローセクション */}
      <motion.section
        className="pt-16 md:pt-24 pb-16 px-4 text-center relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
            className="mb-6"
          >
            <img
              src={loopediaLogo}
              alt="Loopedia"
              className="h-20 md:h-24 mx-auto mb-4"
            />
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              ルーパーのためのプラットフォーム
            </h1>
          </motion.div>
          <motion.p
            className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed whitespace-nowrap"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            RC505mk2ユーザーのためのプリセット共有プラットフォーム。
            <br />
            あなたのサウンドを共有し、世界中のルーパーとつながりましょう。
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-4"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            <Link href="/login">
              <Button
                size="lg"
                className="w-full sm:w-auto hover:scale-105 transition-transform"
              >
                ログイン / 登録
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto hover:scale-105 transition-transform"
              onClick={() => setGuestMode(true)}
            >
              ゲストとして閲覧
            </Button>
          </motion.div>
        </div>

        {/* 背景装飾要素 */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 pointer-events-none">
          <motion.div
            className="absolute top-10 left-10 w-64 h-64 rounded-full bg-primary/20 blur-3xl"
            animate={{
              x: [0, 30, 0],
              y: [0, 20, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 15,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"
            animate={{
              x: [0, -40, 0],
              y: [0, -30, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 20,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </div>
      </motion.section>

      {/* 特徴セクション */}
      <motion.section
        className="py-16 bg-muted/30 relative"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2
            className="text-3xl font-bold text-center mb-12"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Loopediaの特徴
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 特徴1 */}
            <motion.div
              className="bg-background rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M21 15V6" />
                  <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                  <path d="M12 12H3" />
                  <path d="M16 6H3" />
                  <path d="M12 18H3" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-2">プリセット共有</h3>
              <p className="text-muted-foreground text-lg">
                あなたのオリジナルプリセットを世界中のループステーションユーザーと共有できます。パラメータやタグ、詳細な解説も添えて公開しましょう。
              </p>
            </motion.div>

            {/* 特徴2 */}
            <motion.div
              className="bg-background rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -5 }}
            >
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                  <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                  <line x1="6" x2="6" y1="2" y2="4" />
                  <line x1="10" x2="10" y1="2" y2="4" />
                  <line x1="14" x2="14" y1="2" y2="4" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-2">コミュニティ</h3>
              <p className="text-muted-foreground text-lg">
                創作者同士でコメント、いいね、ブックマークを通じて交流。お気に入りのプリセットを見つけたらすぐに反応できます。
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* 更なる特徴セクション */}
      <motion.section
        className="py-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2
            className="text-3xl font-bold text-center mb-12"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            もっと詳しく
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h3 className="text-2xl font-semibold mb-4">達成システム</h3>
              <p className="text-muted-foreground mb-6 text-lg">
                プリセットの作成や共有、コミュニティ貢献に応じて称号を獲得できます。あなたの経験とスキルを示す多彩な称号を集めましょう。
              </p>
              <ul className="space-y-3">
                <motion.li
                  className="flex items-start"
                  whileHover={{ scale: 1.02, x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-3 text-primary"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-lg">複数の称号を同時に保持可能</span>
                </motion.li>
                <motion.li
                  className="flex items-start"
                  whileHover={{ scale: 1.02, x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-3 text-primary"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-lg">
                    特別なアクティビティで限定称号を入手
                  </span>
                </motion.li>
                <motion.li
                  className="flex items-start"
                  whileHover={{ scale: 1.02, x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-3 text-primary"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-lg">
                    コミュニティ内での地位を示す名誉ある称号
                  </span>
                </motion.li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h3 className="text-2xl font-semibold mb-4">プリセット管理</h3>
              <p className="text-muted-foreground mb-6 text-lg">
                RC505mk2のプリセットを詳細に記録・整理・共有できます。パラメータの細かい設定まで含めた情報共有が可能です。
              </p>
              <ul className="space-y-3">
                <motion.li
                  className="flex items-start"
                  whileHover={{ scale: 1.02, x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-3 text-primary"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-lg">
                    詳細なエフェクトパラメータの記録と閲覧
                  </span>
                </motion.li>
                <motion.li
                  className="flex items-start"
                  whileHover={{ scale: 1.02, x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-3 text-primary"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-lg">タグによる効率的な分類と検索</span>
                </motion.li>
                <motion.li
                  className="flex items-start"
                  whileHover={{ scale: 1.02, x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-3 text-primary"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-lg">
                    プリセットの使用例や解説の共有
                  </span>
                </motion.li>
              </ul>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* CTAセクション */}
      <motion.section
        className="py-16 bg-primary/5 w-full px-0"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            className="text-3xl font-bold mb-6"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            今すぐ始めよう
          </motion.h2>
          <motion.p
            className="text-xl text-muted-foreground mb-8 w-full"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            無料でアカウント登録して、ルーパーとつながりましょう。または、ゲストとしてプリセットを閲覧することもできます。
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-4"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link href="/login">
              <Button
                size="lg"
                className="w-full sm:w-auto hover:scale-105 transition-transform"
              >
                ログイン / 登録
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto hover:scale-105 transition-transform"
              onClick={() => setGuestMode(true)}
            >
              ゲストとして閲覧
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* 開発者情報セクション */}
      <motion.section
        className="py-10 bg-muted/10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.h3
            className="text-xl font-semibold mb-4"
            initial={{ y: 10, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            開発・運営
          </motion.h3>
          <motion.div
            className="mb-6"
            initial={{ y: 10, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <p className="text-lg mb-2">ありのみ</p>
            <a
              href="https://twitter.com/arinomi_loop"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="mr-1"
              >
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
              </svg>
              @arinomi_loop
            </a>
          </motion.div>
          <motion.p
            className="text-muted-foreground text-sm"
            initial={{ y: 10, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            © 2023-2025 Loopedia. All Rights Reserved.
          </motion.p>
          
          {/* 免責事項 */}
          <motion.p
            className="text-muted-foreground text-xs mt-4 max-w-2xl mx-auto"
            initial={{ y: 10, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            このサイトは、RC505mk2のメーカーであるBOSS（Roland Corporation）とは一切関係がありません。BOSSの製品やサービスに関する公式情報は、<a href="https://www.boss.info/jp/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.boss.info/jp/</a>をご覧ください。RC505mk2に関する詳細情報は<a href="https://www.boss.info/jp/products/rc-505mk2/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.boss.info/jp/products/rc-505mk2/</a>を参照してください。当サイトに掲載されている内容に関する責任は、サイト運営者にあります。BOSSは当サイトの情報について、一切の責任を負いません。
          </motion.p>
        </div>
      </motion.section>
    </div>
  );
}
