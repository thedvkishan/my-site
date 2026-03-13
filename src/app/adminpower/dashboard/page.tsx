
import { notFound } from 'next/navigation';

/**
 * Institutional Terminal: This path has been decommissioned.
 * Administrative oversight is now centralized at /admin.
 */
export default function DecommissionedDashboard() {
    notFound();
}
