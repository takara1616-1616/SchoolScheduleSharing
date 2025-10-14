import { supabase } from "./supabaseClient";

// Color mappings for subjects
const SUBJECT_COLORS: { [key: string]: string } = {
  "国語": "#FF9F9F",
  "数学": "#7B9FE8",
  "英語": "#FFD6A5",
  "理科": "#A8E8D8",
  "社会": "#B8A8E8",
  "保健体育": "#FFA8C8",
  "芸術": "#FFB8E8",
  "家庭": "#FFE8A8",
  "情報": "#C8D8FF",
  "その他": "#D8D8D8",
};

const CATEGORY_COLORS: { [key: string]: string } = {
  "行事": "#FFA8C8",
  "連絡事項": "#A8D8E8",
  "持ち物": "#FFE8A8",
  "その他": "#D8D8D8",
};

// Helper function to get authenticated user's ID from users table
async function getCurrentUserIdFromDatabase(): Promise<number | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return null;

    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user ID:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error in getCurrentUserIdFromDatabase:', error);
    return null;
  }
}

// Fetch assignments from announcements table (type='assignment')
export async function fetchAssignments() {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        id,
        title,
        description,
        due_date,
        submission_method,
        subjects ( name ),
        subsubjects ( name )
      `)
      .eq('type', 'assignment')
      .order('due_date', { ascending: true });

    if (error) throw error;

    // Transform database format to component format
    return (data || []).map((item: any) => ({
      id: item.id.toString(),
      subject: item.subjects?.name || "その他",
      subjectColor: SUBJECT_COLORS[item.subjects?.name || "その他"] || "#D8D8D8",
      course: item.subsubjects?.name || "",
      content: item.description || item.title || "",
      submitTo: item.submission_method || "先生",
      deadline: item.due_date ? formatDateJapanese(new Date(item.due_date)) : "",
      isChecked: false, // Default to unchecked for teacher view
    }));
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return [];
  }
}

// Fetch test ranges from announcements table (type='test')
export async function fetchTestRanges() {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        id,
        title,
        description,
        due_date,
        subjects ( name ),
        subsubjects ( name )
      `)
      .eq('type', 'test')
      .order('due_date', { ascending: true });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id.toString(),
      subject: item.subjects?.name || "その他",
      subjectColor: SUBJECT_COLORS[item.subjects?.name || "その他"] || "#D8D8D8",
      course: item.subsubjects?.name || "",
      content: item.description || item.title || "",
      testDate: item.due_date ? formatDateJapanese(new Date(item.due_date)) : "",
    }));
  } catch (error) {
    console.error('Error fetching test ranges:', error);
    return [];
  }
}

// Fetch other notices from announcements table (type='other')
export async function fetchOtherNotices() {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        id,
        title,
        description,
        due_date
      `)
      .eq('type', 'other')
      .order('due_date', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id.toString(),
      title: item.title || "",
      content: item.description || "",
      category: "その他", // Default category since it's not in DB
      categoryColor: CATEGORY_COLORS["その他"] || "#D8D8D8",
      date: item.due_date ? formatDateJapanese(new Date(item.due_date)) : "",
    }));
  } catch (error) {
    console.error('Error fetching other notices:', error);
    return [];
  }
}

// Fetch teachers from users table
// Note: This is a placeholder. Proper teacher tracking would need a separate table or role field
export async function fetchTeachers() {
  try {
    // For now, return all users as potential teachers
    // In a real implementation, you'd want a roles or teachers table
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email')
      .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map((teacher: any) => ({
      id: teacher.id.toString(),
      name: teacher.name || teacher.email || "名前なし",
      subjects: [], // Would need a separate table to track teacher subjects
      email: teacher.email || "",
    }));
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
}

// Fetch subjects with subsubjects
export async function fetchSubjectsWithCourses() {
  try {
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('id, name')
      .order('name', { ascending: true });

    if (subjectsError) throw subjectsError;

    const { data: subsubjects, error: subsubjectsError } = await supabase
      .from('subsubjects')
      .select('id, name, subject_id')
      .order('name', { ascending: true });

    if (subsubjectsError) throw subsubjectsError;

    // Transform to component format
    const result: any[] = [];
    let idCounter = 1;

    (subsubjects || []).forEach((subsubject: any) => {
      const subject = (subjects || []).find((s: any) => s.id === subsubject.subject_id);
      if (subject) {
        result.push({
          id: (idCounter++).toString(),
          category: subject.name,
          categoryColor: SUBJECT_COLORS[subject.name] || "#D8D8D8",
          courseName: subsubject.name,
        });
      }
    });

    return result;
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
}

// Create assignment
export async function createAssignment(assignment: {
  subject: string;
  course: string;
  content: string;
  submitTo: string;
  deadline: string;
}) {
  try {
    const userId = await getCurrentUserIdFromDatabase();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Find subject ID by name
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', assignment.subject)
      .maybeSingle();

    // Find subsubject ID by name
    const { data: subsubjectData } = await supabase
      .from('subsubjects')
      .select('id')
      .eq('name', assignment.course)
      .maybeSingle();

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        subject_id: subjectData?.id || null,
        subsubject_id: subsubjectData?.id || null,
        created_by: userId,
        title: assignment.content.substring(0, 100),
        description: assignment.content,
        type: 'assignment',
        due_date: parseDateJapanese(assignment.deadline),
        submission_method: assignment.submitTo,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
}

// Create test range
export async function createTestRange(testRange: {
  subject: string;
  course: string;
  content: string;
  testDate: string;
}) {
  try {
    const userId = await getCurrentUserIdFromDatabase();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', testRange.subject)
      .maybeSingle();

    const { data: subsubjectData } = await supabase
      .from('subsubjects')
      .select('id')
      .eq('name', testRange.course)
      .maybeSingle();

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        subject_id: subjectData?.id || null,
        subsubject_id: subsubjectData?.id || null,
        created_by: userId,
        title: testRange.content.substring(0, 100),
        description: testRange.content,
        type: 'test',
        due_date: parseDateJapanese(testRange.testDate),
        submission_method: '', // Required field even for tests
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating test range:', error);
    throw error;
  }
}

// Create other notice
export async function createOtherNotice(notice: {
  title: string;
  content: string;
  category: string;
  date: string;
}) {
  try {
    const userId = await getCurrentUserIdFromDatabase();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        created_by: userId,
        title: notice.title,
        description: notice.content,
        type: 'other',
        due_date: parseDateJapanese(notice.date),
        submission_method: '', // Required field
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating other notice:', error);
    throw error;
  }
}

// Delete assignments
export async function deleteAssignments(ids: string[]) {
  try {
    const numericIds = ids.map(id => parseInt(id));
    const { error } = await supabase
      .from('announcements')
      .delete()
      .in('id', numericIds);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting assignments:', error);
    throw error;
  }
}

// Delete test ranges
export async function deleteTestRanges(ids: string[]) {
  try {
    const numericIds = ids.map(id => parseInt(id));
    const { error } = await supabase
      .from('announcements')
      .delete()
      .in('id', numericIds);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting test ranges:', error);
    throw error;
  }
}

// Delete other notices
export async function deleteOtherNotices(ids: string[]) {
  try {
    const numericIds = ids.map(id => parseInt(id));
    const { error } = await supabase
      .from('announcements')
      .delete()
      .in('id', numericIds);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting other notices:', error);
    throw error;
  }
}

// Update assignment
export async function updateAssignment(id: string, updates: any) {
  try {
    const { error } = await supabase
      .from('announcements')
      .update({
        description: updates.content,
        submission_method: updates.submitTo,
        due_date: updates.deadline ? parseDateJapanese(updates.deadline) : null,
      })
      .eq('id', parseInt(id));

    if (error) throw error;
  } catch (error) {
    console.error('Error updating assignment:', error);
    throw error;
  }
}

// Update test range
export async function updateTestRange(id: string, updates: any) {
  try {
    const { error } = await supabase
      .from('announcements')
      .update({
        description: updates.content,
        due_date: updates.testDate ? parseDateJapanese(updates.testDate) : null,
      })
      .eq('id', parseInt(id));

    if (error) throw error;
  } catch (error) {
    console.error('Error updating test range:', error);
    throw error;
  }
}

// Update other notice
export async function updateOtherNotice(id: string, updates: any) {
  try {
    const { error } = await supabase
      .from('announcements')
      .update({
        title: updates.title,
        description: updates.content,
        due_date: updates.date ? parseDateJapanese(updates.date) : null,
      })
      .eq('id', parseInt(id));

    if (error) throw error;
  } catch (error) {
    console.error('Error updating other notice:', error);
    throw error;
  }
}

// Helper function to format date in Japanese style
function formatDateJapanese(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日(${weekday})`;
}

// Helper function to parse Japanese date string (rough approximation)
function parseDateJapanese(dateStr: string): string | null {
  try {
    // Try to extract month and day from format like "6月8日(火)"
    const match = dateStr.match(/(\d+)月(\d+)日/);
    if (match) {
      const month = parseInt(match[1]);
      const day = parseInt(match[2]);
      const currentYear = new Date().getFullYear();
      const date = new Date(currentYear, month - 1, day);
      return date.toISOString();
    }
    return null;
  } catch {
    return null;
  }
}

// ============ Subjects/Subsubjects CRUD Functions ============

// Create subsubject (科目)
export async function createSubsubject(data: { category: string; courseName: string }) {
  try {
    // Find or create subject
    let subjectId: number | null = null;
    const { data: existingSubject } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', data.category)
      .maybeSingle();

    if (existingSubject) {
      subjectId = existingSubject.id;
    } else {
      // Create new subject
      const { data: newSubject, error: subjectError } = await supabase
        .from('subjects')
        .insert({ name: data.category })
        .select()
        .single();

      if (subjectError) throw subjectError;
      subjectId = newSubject.id;
    }

    // Create subsubject
    const { data: newSubsubject, error } = await supabase
      .from('subsubjects')
      .insert({
        subject_id: subjectId,
        name: data.courseName,
      })
      .select()
      .single();

    if (error) throw error;
    return newSubsubject;
  } catch (error) {
    console.error('Error creating subsubject:', error);
    throw error;
  }
}

// Update subsubject
export async function updateSubsubject(courseName: string, updates: { category: string; courseName: string }) {
  try {
    // Find subsubject by name
    const { data: subsubject } = await supabase
      .from('subsubjects')
      .select('id')
      .eq('name', courseName)
      .maybeSingle();

    if (!subsubject) {
      throw new Error('Subsubject not found');
    }

    // Find or create subject
    let subjectId: number | null = null;
    const { data: existingSubject } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', updates.category)
      .maybeSingle();

    if (existingSubject) {
      subjectId = existingSubject.id;
    } else {
      const { data: newSubject, error: subjectError } = await supabase
        .from('subjects')
        .insert({ name: updates.category })
        .select()
        .single();

      if (subjectError) throw subjectError;
      subjectId = newSubject.id;
    }

    // Update subsubject
    const { error } = await supabase
      .from('subsubjects')
      .update({
        subject_id: subjectId,
        name: updates.courseName,
      })
      .eq('id', subsubject.id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating subsubject:', error);
    throw error;
  }
}

// Delete subsubjects
export async function deleteSubsubjects(courseNames: string[]) {
  try {
    const { error } = await supabase
      .from('subsubjects')
      .delete()
      .in('name', courseNames);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting subsubjects:', error);
    throw error;
  }
}

// ============ Teachers CRUD Functions ============

// Create teacher (user)
export async function createTeacher(teacher: { name: string; email: string; subjects: string[] }) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        name: teacher.name,
        email: teacher.email,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating teacher:', error);
    throw error;
  }
}

// Update teacher
export async function updateTeacher(id: string, updates: { name: string; subjects: string[] }) {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        name: updates.name,
      })
      .eq('id', parseInt(id));

    if (error) throw error;
  } catch (error) {
    console.error('Error updating teacher:', error);
    throw error;
  }
}

// Delete teachers
export async function deleteTeachers(ids: string[]) {
  try {
    const numericIds = ids.map(id => parseInt(id));
    const { error } = await supabase
      .from('users')
      .delete()
      .in('id', numericIds);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting teachers:', error);
    throw error;
  }
}
