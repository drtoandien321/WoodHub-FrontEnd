import StatsReport from '../../components/supplier/StatsReport.jsx';

// Báo cáo xưởng — số liệu thật BE-09 (xem StatsReport); khối báo giá / đơn custom hiện khi BE trả `workshop`.
export default function WorkshopReports() {
  return <StatsReport basePath="/portal/workshop" />;
}
