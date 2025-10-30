import fs from 'fs';
import path from 'path';

// JSONファイルのパス
const CONTACTS_FILE_PATH = path.join(process.cwd(), 'data', 'contacts.json');
console.log('Contacts file path:', CONTACTS_FILE_PATH);

// 返信のタイプ定義
export interface Reply {
  id: number;
  contactId: number;
  message: string;
  isAdmin: boolean; // true=管理者からの返信、false=ユーザーからの返信
  createdAt: string;
}

// お問い合わせタイプの定義
export interface Contact {
  id: number;
  userId?: number;
  name: string;
  contactMethod?: string;
  contactDetail?: string;
  category: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  isAnonymous?: boolean; // 匿名フラグを追加
  createdAt: string;
  replies?: Reply[];
}

// お問い合わせリストの型
type ContactList = Contact[];

// データディレクトリとJSONファイルの存在確認・作成
function ensureFileExists(): void {
  const dataDir = path.join(process.cwd(), 'data');
  
  // データディレクトリが存在しない場合は作成
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // JSONファイルが存在しない場合は空の配列で作成
  if (!fs.existsSync(CONTACTS_FILE_PATH)) {
    fs.writeFileSync(CONTACTS_FILE_PATH, JSON.stringify([]), 'utf8');
  }
}

// すべてのお問い合わせを取得
export function getAllContacts(): ContactList {
  ensureFileExists();
  
  try {
    console.log('Reading contacts file from:', CONTACTS_FILE_PATH);
    const data = fs.readFileSync(CONTACTS_FILE_PATH, 'utf8');
    // ファイルの内容が長すぎるため、省略したログを出力
    console.log('Contacts file length:', data.length, 'characters');
    const contacts = JSON.parse(data);
    console.log('Parsed contacts:', contacts.length, 'items');
    
    // 各ステータスごとのカウントをログ出力
    const statusCounts = {
      new: contacts.filter((c: Contact) => c.status === 'new').length,
      in_progress: contacts.filter((c: Contact) => c.status === 'in_progress').length,
      resolved: contacts.filter((c: Contact) => c.status === 'resolved').length
    };
    console.log('Contact statuses:', statusCounts);
    
    return contacts;
  } catch (error) {
    console.error('Error reading contacts file:', error);
    return [];
  }
}

// 特定のお問い合わせを取得
export function getContactById(id: number): Contact | undefined {
  const contacts = getAllContacts();
  return contacts.find(contact => contact.id === id);
}

// 新しいお問い合わせを作成
export function createContact(contact: Omit<Contact, 'id' | 'createdAt' | 'status'>): Contact {
  ensureFileExists();
  
  const contacts = getAllContacts();
  
  // 新しいIDを生成（既存の最大ID + 1、または1）
  const newId = contacts.length > 0 
    ? Math.max(...contacts.map(c => c.id)) + 1 
    : 1;
  
  // 新しいお問い合わせを作成
  const newContact: Contact = {
    ...contact,
    id: newId,
    status: 'new',
    createdAt: new Date().toISOString()
  };
  
  // 配列に追加して保存
  contacts.push(newContact);
  fs.writeFileSync(CONTACTS_FILE_PATH, JSON.stringify(contacts, null, 2), 'utf8');
  
  return newContact;
}

// お問い合わせステータスを更新
export function updateContactStatus(id: number, status: 'new' | 'in_progress' | 'resolved'): Contact | undefined {
  const contacts = getAllContacts();
  const contactIndex = contacts.findIndex(contact => contact.id === id);
  
  if (contactIndex === -1) {
    return undefined;
  }
  
  // ステータスを更新
  contacts[contactIndex].status = status;
  
  // ファイルに保存
  fs.writeFileSync(CONTACTS_FILE_PATH, JSON.stringify(contacts, null, 2), 'utf8');
  
  return contacts[contactIndex];
}

// お問い合わせに返信を追加
export function addReplyToContact(
  contactId: number, 
  message: string, 
  isAdmin: boolean
): Reply | undefined {
  const contacts = getAllContacts();
  const contactIndex = contacts.findIndex(contact => contact.id === contactId);
  
  if (contactIndex === -1) {
    return undefined;
  }
  
  // 返信配列がない場合は初期化
  if (!contacts[contactIndex].replies) {
    contacts[contactIndex].replies = [];
  }
  
  // 新しい返信IDを生成
  const newReplyId = contacts[contactIndex].replies.length > 0
    ? Math.max(...contacts[contactIndex].replies.map(r => r.id)) + 1
    : 1;
  
  // 新しい返信を作成
  const newReply: Reply = {
    id: newReplyId,
    contactId,
    message,
    isAdmin,
    createdAt: new Date().toISOString()
  };
  
  // 返信を追加
  contacts[contactIndex].replies.push(newReply);
  
  // ファイルに保存
  fs.writeFileSync(CONTACTS_FILE_PATH, JSON.stringify(contacts, null, 2), 'utf8');
  
  return newReply;
}

// 特定のユーザーのお問い合わせを取得
export function getContactsByUserId(userId: number): Contact[] {
  const contacts = getAllContacts();
  return contacts.filter(contact => contact.userId === userId);
}

// お問い合わせの返信を取得
export function getRepliesByContactId(contactId: number): Reply[] {
  const contact = getContactById(contactId);
  return contact?.replies || [];
}
