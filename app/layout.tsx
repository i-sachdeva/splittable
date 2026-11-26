import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'SplitTable — Good company. Fair shares.',description:'A shared table for your bill. Claim items, split shared dishes, and settle every cent.',icons:{icon:'/favicon.svg'},referrer:'no-referrer'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
