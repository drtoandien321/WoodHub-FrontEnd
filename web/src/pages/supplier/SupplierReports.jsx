import StatsReport from '../../components/supplier/StatsReport.jsx';

// Báo cáo NCC — số liệu thật BE-09 (xem StatsReport). NCC có chi nhánh → có bộ lọc chi nhánh.
export default function SupplierReports() {
  return <StatsReport basePath="/portal/supplier" showStores linkProducts />;
}
