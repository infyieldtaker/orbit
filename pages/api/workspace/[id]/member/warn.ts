import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/utils/database';
import { withPermissionCheck } from '@/utils/permissionsManager';

export default withPermissionCheck(async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

	const workspaceGroupId = parseInt(req.query.id as string, 10);
	const { userId, reason } = req.body as { userId?: string; reason?: string };

	if (!userId || !reason?.trim()) return res.status(400).json({ success: false, error: 'userId and reason are required' });

	const member = await prisma.workspaceMember.findUnique({
		where: { workspaceGroupId_userId: { workspaceGroupId, userId: BigInt(userId) } },
	});

	if (!member) return res.status(404).json({ success: false, error: 'Member not found' });

	const warning = await prisma.warning.create({
		data: {
			workspaceGroupId,
			userId: BigInt(userId),
			issuedById: BigInt(req.session.userid!),
			reason: reason.trim(),
		},
	});

	return res.status(200).json({ success: true, warning: { ...warning, userId: warning.userId.toString(), issuedById: warning.issuedById.toString() } });
}, 'warn');