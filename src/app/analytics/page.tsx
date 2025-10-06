'use client';

import { useRouter } from 'next/navigation';
import AnalyticsPage from '@/components/analytics/AnalyticsPage';

export default function AnalyticsRoute() {
    const router = useRouter();

    const handleBack = () => {
        router.push('/');
    };

    return <AnalyticsPage onBack={handleBack} />;
}



