import React from "react";
import { Link } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD形式
  
  return (
    <div className="container max-w-4xl py-8 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">プライバシーポリシー</h1>
      </div>
      
      <div className="bg-card p-4 md:p-6 rounded-lg shadow-sm border">
        <div className="text-sm text-muted-foreground mb-4">
          <div>制定日: 2025年4月17日</div>
          <div>最終改定日: 2025年4月17日</div>
        </div>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="prose dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold mb-2">1. はじめに</h2>
            <p>
              このプライバシーポリシー（以下「本ポリシー」といいます）は、ありのみ(arinomi)（以下「当運営」といいます）が提供するWebアプリケーション「Loopedia」（以下「本サービス」といいます）における利用者情報の取り扱いについて定めたものです。本サービスをご利用いただくためには、本ポリシーの内容をご確認いただき、同意していただく必要があります。
            </p>

            <h2 className="text-xl font-semibold mb-2 mt-6">2. 取得する利用者情報</h2>
            <p>当運営は、本サービスの提供にあたり、以下の利用者情報を取得します。</p>
            
            <h3 className="text-lg font-medium mb-2 mt-4">(1) 利用者にご提供いただく情報</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>利用者ID:</strong> 本サービスの利用登録時に利用者が設定する固有の識別子。</li>
              <li><strong>パスワード（ハッシュ化されたもの）:</strong> 利用者IDと組み合わせて本人認証を行うためのパスワードを、復元不可能な形式（ハッシュ化）で保存したもの。</li>
              <li><strong>プロフィールアイコン:</strong> 利用者が任意で設定する画像データ。</li>
            </ul>
            
            <h3 className="text-lg font-medium mb-2 mt-4">(2) 本サービスの利用に伴い自動的に取得する情報</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Cookie（クッキー）および類似技術により取得する情報:</strong> 当運営は、本サービスの利便性向上、利用状況の分析等のために、Cookieおよびこれに類似する技術（LocalStorage、SessionStorage等を含む）を利用して、利用者の識別子、サイト内の行動履歴、利用環境等の情報を取得することがあります。詳細は第6条をご参照ください。</li>
              <li><strong>IPアドレス:</strong> 利用者が本サービスにアクセスする際に使用するIPアドレス。</li>
              <li><strong>アクセスログ:</strong> 本サービスへのアクセス日時、利用した機能、操作履歴、参照元URL等の情報。</li>
              <li><strong>デバイス情報:</strong> 利用者が使用する端末の種類、OS、バージョン、ブラウザの種類、画面解像度等の情報。</li>
              <li><strong>その他サービス利用状況に関する情報:</strong> 投稿内容、閲覧履歴、検索キーワード等、本サービスの利用に関する情報。</li>
            </ul>
            
            <h3 className="text-lg font-medium mb-2 mt-4">(3) お問い合わせ時に取得する情報</h3>
            <p>お問い合わせ内容に応じて、氏名、連絡先（メールアドレス、Twitterアカウント名等）、その他お問い合わせに必要な情報。これらは利用者から任意でご提供いただくものです。</p>

            <h2 className="text-xl font-semibold mb-2 mt-6">3. 利用目的</h2>
            <p>当運営は、取得した利用者情報を以下の目的のために利用します。</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>本サービスの提供、運営、維持、管理（ログイン状態の維持、本人認証、コンテンツ表示、機能提供等）のため</li>
              <li>利用者の利便性向上（入力補助、設定の記憶等）のため</li>
              <li>本サービスの改善、不具合修正、新機能の開発のため</li>
              <li>利用状況の分析、統計データの作成（個人を特定できない形式に加工した上で利用します）のため</li>
              <li>不正行為（利用規約違反、不正アクセス、なりすまし等）の防止、調査、対応のため</li>
              <li>利用者からのお問い合わせ、ご相談、苦情等への対応のため</li>
              <li>本規約または本ポリシーの変更、サービスに関する重要なお知らせ等の通知のため</li>
              <li>上記の利用目的に付随する目的のため</li>
            </ul>

            <h2 className="text-xl font-semibold mb-2 mt-6">4. 情報の第三者提供</h2>
            <p>当運営は、取得した利用者情報を、以下の場合を除き、あらかじめ利用者の同意を得ることなく第三者に提供しません。</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
              <li>本サービスの運営に必要な範囲内で、業務委託先に利用者情報の取り扱いを委託する場合（この場合、委託先に対し必要かつ適切な監督を行います）</li>
              <li>統計情報（個人を特定できない形式に加工したもの）として提供する場合</li>
            </ul>

            <h2 className="text-xl font-semibold mb-2 mt-6">5. 情報収集モジュール</h2>
            <p>現在、利用状況分析等のための第三者の情報収集モジュールは利用していません。将来的に導入する場合は、本ポリシーを更新してお知らせします。</p>

            <h2 className="text-xl font-semibold mb-2 mt-6">6. Cookie（クッキー）および類似技術について</h2>
            <h3 className="text-lg font-medium mb-2 mt-4">(1) Cookieとは</h3>
            <p>Cookieとは、利用者がウェブサイトを訪問した際に、利用者のコンピュータ（またはスマートフォンやタブレット等のインターネット接続可能な機器）上に保存される小さなテキストファイルのことです。Cookieを利用することにより、ウェブサイトは利用者のコンピュータを識別し、利用者の設定や訪問履歴等の情報を記憶することができます。</p>
            
            <h3 className="text-lg font-medium mb-2 mt-4">(2) Cookieの利用目的</h3>
            <p>当運営は、以下の目的でCookieおよび類似技術を利用します。</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>ログイン状態の維持、セッション管理</li>
              <li>利用者の設定（表示言語など）の記憶</li>
              <li>サービス利用状況の把握・分析によるサービス改善</li>
              <li>セキュリティ確保（不正アクセスの検知など）</li>
            </ul>
            
            <h3 className="text-lg font-medium mb-2 mt-4">(3) Cookieの管理・無効化</h3>
            <p>利用者は、お使いのブラウザの設定を変更することにより、Cookieの機能を無効にすることができます。ただし、Cookieを無効にした場合、本サービスの一部機能が利用できなくなる可能性があります。Cookieの設定変更方法については、各ブラウザの提供元へお問い合わせください。</p>

            <h2 className="text-xl font-semibold mb-2 mt-6">7. 安全管理措置</h2>
            <p>当運営は、取得した利用者情報の漏えい、滅失またはき損の防止その他の利用者情報の安全管理のために、必要かつ適切な措置を講じます。具体的には、以下のような措置を含みます。</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>組織的安全管理措置：</strong>個人情報保護に関する責任者を定め、従業員への教育・監督を行います。</li>
              <li><strong>技術的安全管理措置：</strong>アクセス制御の実施、不正アクセス対策、通信の暗号化（必要な場合）、パスワードのハッシュ化等を行います。</li>
              <li><strong>物理的安全管理措置：</strong>利用者情報を扱う区域への入退室管理や機器・記録媒体の管理を行います。</li>
            </ul>

            <h2 className="text-xl font-semibold mb-2 mt-6">8. 未成年者の利用者情報</h2>
            <p>未成年者の利用については<Link href="/terms-of-service" className="text-primary hover:underline">利用規約第2条第3項</Link>をご確認ください。</p>

            <h2 className="text-xl font-semibold mb-2 mt-6">9. 利用者情報の開示、訂正、利用停止等</h2>
            <p>利用者は、当運営が保有する自身の利用者情報について、本ポリシー末尾のお問い合わせ窓口を通じて、開示、訂正、追加、削除、利用停止、消去（以下「開示等」といいます）を請求することができます。当運営は、請求者がご本人であることを確認した上で、法令に基づき合理的な期間内に対応します。ただし、以下のいずれかに該当する場合は、開示等の請求に応じられない場合があります。</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>本人または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合</li>
              <li>当運営の業務の適正な実施に著しい支障を及ぼすおそれがある場合</li>
              <li>他の法令に違反することとなる場合</li>
              <li>ご本人確認ができない場合</li>
              <li>請求内容が事実と異なる場合、または法令上開示等の義務がない場合</li>
            </ul>
            <p>なお、本サービスはメールアドレスを登録しないため、パスワードを忘れた場合等にご本人確認が困難となり、開示等の請求に応じられない場合があります。アカウントの削除については、<Link href="/terms-of-service" className="text-primary hover:underline">利用規約第14条</Link>に定める方法で行うことができます。</p>

            <h2 className="text-xl font-semibold mb-2 mt-6">10. 本ポリシーの変更</h2>
            <p>当運営は、法令の変更やサービス内容の変更等に伴い、本ポリシーを改定することがあります。重要な変更を行う場合は、本サービス上での告知等、わかりやすい方法でお知らせします。変更後のポリシーは、本サービス上に掲載されたときから効力を生じるものとします。利用者は、定期的に本ポリシーを確認するものとします。</p>

            <h2 className="text-xl font-semibold mb-2 mt-6">11. お問い合わせ窓口</h2>
            <p>本ポリシーに関するご意見、ご質問、苦情のお申し出、その他利用者情報の取り扱いに関するお問い合わせは、以下の窓口までご連絡ください。</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>アプリ内お問い合わせフォーム: <Link href="/contact" className="text-primary hover:underline">お問い合わせページ</Link></li>
              <li>Twitter DM: <a href="https://twitter.com/arinomi_loop" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@arinomi_loop</a></li>
              <li>Email: <a href="mailto:Loopedia2025@gmail.com" className="text-primary hover:underline">Loopedia2025@gmail.com</a></li>
            </ul>
            <p className="mt-2">お問い合わせへの返信には、通常2営業日以上の時間を要する場合があります。</p>

            <h2 className="text-xl font-semibold mb-2 mt-6">12. 事業者の名称・連絡先</h2>
            <p><strong>名称:</strong> ありのみ(arinomi)</p>
            <p><strong>連絡先:</strong> 上記11.のお問い合わせ窓口に同じ</p>

            <div className="text-right mt-8 text-sm text-muted-foreground">
              以上
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}