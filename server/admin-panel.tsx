import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from 'semantic-ui-react';

const InquiryList = ({ inquiries }) => (
  <Table celled>
    <TableHeader>
      <TableRow>
        <TableHead>ID</TableHead>
        <TableHead>日時</TableHead>
        <TableHead>名前</TableHead>
        <TableHead>カテゴリ</TableHead>
        <TableHead>概要</TableHead>
        <TableHead>ステータス</TableHead>
        <TableHead>操作</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {inquiries.map(inquiry => (
        <TableRow key={inquiry.id}>
          <TableCell>{inquiry.id}</TableCell>
          <TableCell>{inquiry.createdAt}</TableCell>
          <TableCell>{inquiry.name}</TableCell>
          <TableCell>{inquiry.category}</TableCell>
          <TableCell>{inquiry.summary}</TableCell>
          <TableCell>{inquiry.status}</TableCell>
          <TableCell>
            {/* 操作ボタンなど */}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default InquiryList;