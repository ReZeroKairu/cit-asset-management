import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../initDatabase';

const router = express.Router();

// Temporary in-memory storage for one-time tokens
const oneTimeTokens: any[] = [];

// Generate one-time QR code token
router.post('/generate-token', async (req, res) => {
  try {
    const { generatedBy, expiresInHours = 24 } = req.body;
    
    // Generate unique token
    const token = crypto.randomUUID();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setHours(tokenExpiresAt.getHours() + expiresInHours);
    
    // Store token in memory
    const oneTimeLink = {
      id: oneTimeTokens.length + 1,
      token,
      generatedBy,
      expiresAt: tokenExpiresAt,
      used: false,
    };
    
    oneTimeTokens.push(oneTimeLink);
    
    res.json({ 
      success: true, 
      token,
      expiresAt: tokenExpiresAt,
      tokenId: oneTimeLink.id,
      generatedBy: oneTimeLink.generatedBy,
      message: 'New token generated. Previous tokens remain valid until used or expired.'
    });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate token' 
    });
  }
});

// Validate one-time token
router.get('/validate/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const oneTimeLink = oneTimeTokens.find(t => 
      t.token === token && 
      !t.used && 
      new Date(t.expiresAt) > new Date()
    );
    
    if (!oneTimeLink) {
      return res.json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    
    // Fetch user's full name and assigned lab if generatedBy is available
    let custodianName = '';
    let assignedLab = '';
    if (oneTimeLink.generatedBy) {
      try {
        const user = await prisma.users.findUnique({
          where: { user_id: oneTimeLink.generatedBy },
          select: { 
            full_name: true,
            assigned_lab: {
              select: { lab_name: true }
            }
          }
        });
        custodianName = user?.full_name || '';
        assignedLab = user?.assigned_lab?.lab_name || '';
      } catch (error) {
        console.error('Error fetching user info:', error);
        // Continue without the info if there's an error
      }
    }
    
    res.json({ 
      success: true, 
      tokenId: oneTimeLink.id,
      expiresAt: oneTimeLink.expiresAt,
      generatedBy: custodianName, // Return the full name instead of ID
      assignedLab: assignedLab // Return the assigned laboratory
    });
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({ success: false, message: 'Failed to validate token' });
  }
});

// Submit form using one-time token
router.post('/submit/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { formType, formData } = req.body;
    
    // Find and validate token
    console.log('Looking for token:', token);
    console.log('Available tokens:', oneTimeTokens);
    const tokenIndex = oneTimeTokens.findIndex(t => 
      t.token === token && 
      !t.used && 
      new Date(t.expiresAt) > new Date()
    );
    
    console.log('Token index found:', tokenIndex);
    console.log('Token details:', tokenIndex !== -1 ? oneTimeTokens[tokenIndex] : 'Not found');
    
    if (tokenIndex === -1) {
      console.log('Token validation FAILED - Invalid or expired');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    
    console.log('Token validation PASSED');
    
    // Get the token to find who generated it
    const oneTimeToken = oneTimeTokens[tokenIndex];
    const generatedBy = oneTimeToken?.generatedBy || 1;
    
    // Mark token as used IMMEDIATELY to prevent duplicate submissions
    oneTimeTokens[tokenIndex].used = true;
    
    console.log('🔍 Form submitted via one-time token:', { formType, token, formData, generatedBy });
    console.log('🔍 GeneratedBy type:', typeof generatedBy, 'GeneratedBy value:', generatedBy);
    
    // Check for duplicate form submitted in last 10 seconds (same name, lab, purpose)
    const tenSecondsAgo = new Date(Date.now() - 10000);
    
    if (formType === 'lab-request') {
      const recentDuplicate = await prisma.lab_requests.findFirst({
        where: {
          faculty_student_name: formData.faculty_student_name || '',
          laboratory: formData.laboratory || '',
          purpose: formData.purpose || '',
          created_at: { gte: tenSecondsAgo }
        }
      });
      if (recentDuplicate) {
        console.log('Duplicate lab request detected, returning existing record');
        return res.json({
          success: true,
          message: 'Form submitted successfully',
          data: { 
            ...formData, 
            submittedVia: 'one-time-token', 
            token,
            userId: generatedBy,
            formId: recentDuplicate.request_id
          }
        });
      }
    } else if (formType === 'equipment-borrow') {
      const recentDuplicate = await prisma.equipment_borrows.findFirst({
        where: {
          faculty_student_name: formData.faculty_student_name || '',
          laboratory: formData.laboratory || '',
          purpose: formData.purpose || '',
          created_at: { gte: tenSecondsAgo }
        }
      });
      if (recentDuplicate) {
        console.log('Duplicate equipment borrow detected, returning existing record');
        return res.json({
          success: true,
          message: 'Form submitted successfully',
          data: { 
            ...formData, 
            submittedVia: 'one-time-token', 
            token,
            userId: generatedBy,
            formId: recentDuplicate.borrow_id
          }
        });
      }
    }
    
    let formRecord;
    if (formType === 'lab-request') {
      formRecord = await prisma.lab_requests.create({
        data: {
          date: new Date(),
          usage_type: formData.usage_type || 'printing',
          faculty_student_name: formData.faculty_student_name || '',
          year_level: formData.year_level || '',
          laboratory: formData.laboratory || '',
          printing_pages: formData.printing_pages || '',
          ws_number: formData.ws_number || '',
          time_in: formData.time_in || '',
          time_out: formData.time_out || '',
          purpose: formData.purpose || '',
          requested_by: formData.requested_by || '',
          remarks: formData.remarks || '',
          monitored_by: formData.monitored_by || '',
          user_id: generatedBy,
          status: 'Pending'
        }
      }).catch(error => {
        console.error('❌ Database error creating lab request:', error);
        throw error;
      });
    } else if (formType === 'equipment-borrow') {
      formRecord = await prisma.equipment_borrows.create({
        data: {
          date: new Date(),
          laboratory: formData.laboratory || '',
          faculty_student_name: formData.faculty_student_name || '',
          year_level: formData.year_level || '',
          release_time: formData.release_time || '',
          returned_time: formData.returned_time || '',
          equipment_list: formData.equipment_list || [],
          purpose: formData.purpose || '',
          requested_by: formData.requested_by || '',
          remarks: formData.remarks || '',
          monitored_by: formData.monitored_by || '',
          approved_by: formData.approved_by || '',
          user_id: generatedBy,
          status: 'Pending'
        }
      }).catch(error => {
        console.error('❌ Database error creating equipment borrow:', error);
        throw error;
      });
    } else if (formType === 'software-install') {
      formRecord = await prisma.software_installations.create({
        data: {
          faculty_name: formData.faculty_name || '',
          date: new Date(),
          laboratory: formData.laboratory || '',
          software_list: formData.software_list || '',
          requested_by: formData.requested_by || '',
          installation_remarks: formData.installation_remarks || '',
          prepared_by: formData.prepared_by || '',
          feedback_date: formData.feedback_date ? new Date(formData.feedback_date) : null,
          user_id: generatedBy
        }
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Unsupported form type' 
      });
    }
    
    // Get correct ID based on form type
    let formId = 0;
    if (formType === 'equipment-borrow') {
      formId = (formRecord as any).borrow_id;
    } else if (formType === 'lab-request') {
      formId = (formRecord as any).request_id;
    } else if (formType === 'software-install') {
      formId = (formRecord as any).id;
    }
    
    res.json({
      success: true,
      message: 'Form submitted successfully',
      data: { 
        ...formData, 
        submittedVia: 'one-time-token', 
        token,
        userId: generatedBy,
        formId
      }
    });
  } catch (error) {
    console.error('Error submitting form with one-time token:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      formType: req.body.formType,
      formData: req.body.formData,
      token: req.params.token
    });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit form',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user's assigned lab
router.get('/users/:userId/assigned-lab', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.users.findUnique({
      where: { user_id: parseInt(userId) },
      select: { 
        full_name: true,
        assigned_lab: {
          select: { lab_name: true }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      labName: user.assigned_lab?.lab_name || '',
      userName: user.full_name
    });
  } catch (error) {
    console.error('Error fetching assigned lab:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch assigned lab' 
    });
  }
});

export default router;
