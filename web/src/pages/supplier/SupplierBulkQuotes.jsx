import BulkQuoteList from '../../components/bulk/BulkQuoteList.jsx';

// Portal NCC: yêu cầu báo giá số lượng lớn gửi tới mình (BE-08 §3), mặc định tab "Chờ báo giá"
export default function SupplierBulkQuotes() {
  return <BulkQuoteList role="supplier" />;
}
