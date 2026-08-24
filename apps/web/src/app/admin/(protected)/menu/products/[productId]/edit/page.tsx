import { AdminEditProductScreen } from "@/features/admin-menu";

interface AdminEditProductPageProps {
  params: Promise<{
    productId: string;
  }>;
}

export default async function AdminEditProductPage({
  params,
}: AdminEditProductPageProps) {
  const { productId } = await params;

  return <AdminEditProductScreen productId={productId} />;
}
