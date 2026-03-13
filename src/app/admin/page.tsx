
import { notFound } from 'next/navigation';

/**
 * Institutional Terminal: This path has been decommissioned.
 * Administrative oversight is now exclusively at /adminpower.
 */
export default function AdminRootRedirect() {
    notFound();
}
