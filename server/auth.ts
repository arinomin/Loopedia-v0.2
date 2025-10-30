import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import * as crypto from "crypto";
import { promisify } from "util";

// パスワードをハッシュ化する関数
export async function hashPassword(password: string): Promise<string> {
  const scrypt = promisify(crypto.scrypt);
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = (await scrypt(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// パスワードを検証する関数
export async function verifyPassword(storedPassword: string, suppliedPassword: string): Promise<boolean> {
  // ハッシュ化されたパスワードかどうか確認（.で区切られている場合はハッシュ化済み）
  if (storedPassword.includes('.')) {
    const scrypt = promisify(crypto.scrypt);
    const [hashedPassword, salt] = storedPassword.split('.');
    if (!hashedPassword || !salt) return false;
    
    try {
      const buf = (await scrypt(suppliedPassword, salt, 64)) as Buffer;
      const keyBuffer = Buffer.from(hashedPassword, 'hex');
      return crypto.timingSafeEqual(buf, keyBuffer);
    } catch (error) {
      console.error("Password verification error:", error);
      return false;
    }
  } else {
    // 以前のプレーンテキストパスワードとの互換性を保持
    console.log("Using legacy password verification");
    return storedPassword === suppliedPassword;
  }
}

export function configurePassport() {
  // Configure passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Login attempt for user: ${username}`);
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`Authentication failed: User "${username}" not found`);
          return done(null, false, { message: "Incorrect username" });
        }
        
        // ハッシュ化されたパスワードを検証
        const isPasswordValid = await verifyPassword(user.password, password);
        if (!isPasswordValid) {
          console.log(`Authentication failed: Invalid password for user "${username}"`);
          return done(null, false, { message: "Incorrect password" });
        }
        
        console.log(`User "${username}" (id: ${user.id}) authenticated successfully`);
        return done(null, { id: user.id, username: user.username });
      } catch (error) {
        console.error("Authentication error:", error);
        return done(error);
      }
    })
  );

  // Serialize user to the session
  passport.serializeUser((user: any, done) => {
    console.log(`Serializing user to session: ${user.username} (id: ${user.id})`);
    
    // ユーザーIDをシリアライズ
    done(null, user.id);
    
    // デバッグ用にセッション情報を表示
    setTimeout(() => {
      try {
        console.log("Current active sessions in store:", 
          Object.keys((passport as any)._serializers).length);
      } catch (e) {
        console.log("Could not get session info");
      }
    }, 100);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`Deserializing user from session with id: ${id}`);
      const user = await storage.getUser(id);
      
      if (!user) {
        console.log(`Deserialization failed: User with id ${id} not found`);
        return done(null, false);
      }
      
      console.log(`User deserialized successfully: ${user.username} (id: ${user.id})`);
      done(null, { id: user.id, username: user.username });
    } catch (error) {
      console.error("Deserialization error:", error);
      done(error);
    }
  });
}
