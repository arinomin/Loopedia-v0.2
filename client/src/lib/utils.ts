import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to JST (Japan Standard Time)
export function formatDate(date: string | Date, format: string = 'default'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Convert to JST
  const jstDate = new Date(dateObj.getTime() + (9 * 60 * 60 * 1000)); // +9 hours for JST
  
  const year = jstDate.getUTCFullYear();
  const month = (jstDate.getUTCMonth() + 1).toString().padStart(2, '0'); // getMonth is 0-indexed
  const day = jstDate.getUTCDate().toString().padStart(2, '0');
  const hours = jstDate.getUTCHours().toString().padStart(2, '0');
  const minutes = jstDate.getUTCMinutes().toString().padStart(2, '0');
  
  // Handle different format options
  if (format === 'yyyy年MM月dd日') {
    return `${year}年${month}月${day}日`;
  } else if (format === 'yyyy/MM/dd') {
    return `${year}/${month}/${day}`;
  } else {
    // Default format: YYYY年MM月DD日 HH:MM JST
    return `${year}年${month}月${day}日 ${hours}:${minutes} JST`;
  }
}

// Convert parameters object to formatted string for display
export function formatParameters(parameters: Record<string, any>): string {
  return Object.entries(parameters)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
}

// Generate initials from username
export function getInitials(username: string): string {
  return username.substring(0, 2).toUpperCase();
}
