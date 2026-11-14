import { z } from 'zod';

const VN_PHONE_REGEX = /^(0[35789])[0-9]{8}$/;
const VALID_ROLES = ['Candidate', 'Recruiter', 'Company'];

const zodToErrors = (zodError) => {
    const errors = {};
    for (const issue of zodError.issues) {
        const key = String(issue.path[issue.path.length - 1] || 'form');
        if (!errors[key]) {
            errors[key] = issue.message;
        }
    }
    return { isValid: Object.keys(errors).length === 0, errors };
};

export const loginSchema = z.object({
    email: z.string().trim().min(1, 'Vui lòng nhập email.').email('Email không đúng định dạng.'),
    password: z.string().min(1, 'Vui lòng nhập mật khẩu.').min(6, 'Mật khẩu phải có ít nhất 6 ký tự.')
});

export const registerSchema = z.object({
    fullName: z.string().trim().min(1, 'Vui lòng nhập họ và tên.')
        .min(2, 'Họ tên phải từ 2 đến 100 ký tự.')
        .max(100, 'Họ tên phải từ 2 đến 100 ký tự.'),
    email: z.string().trim().min(1, 'Vui lòng nhập email.').email('Email không đúng định dạng.'),
    password: z.string().min(1, 'Vui lòng nhập mật khẩu.').min(6, 'Mật khẩu phải có ít nhất 6 ký tự.'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu.'),
    role: z.enum(VALID_ROLES, { errorMap: () => ({ message: 'Vui lòng chọn vai trò hợp lệ.' }) })
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmPassword']
});

export const companySchema = z.object({
    companyName: z.string().trim().min(1, 'Tên công ty không được để trống.').max(200, 'Tên công ty tối đa 200 ký tự.'),
    website: z.string().trim().max(255, 'Đường dẫn website tối đa 255 ký tự.').optional().or(z.literal('')),
    size: z.string().optional().or(z.literal('')),
    taxCode: z.string().trim().max(50, 'Mã số thuế tối đa 50 ký tự.').optional().or(z.literal('')),
    logoImg: z.string().optional().or(z.literal(''))
});

export const profileSchema = z.object({
    fullName: z.string().trim().min(1, 'Họ và tên không được để trống.').max(100, 'Họ và tên tối đa 100 ký tự.'),
    role: z.string().optional(),
    candidate: z.object({
        phone: z.string().optional().nullable(),
        birthday: z.string().optional().nullable(),
        address: z.string().max(500, 'Địa chỉ tối đa 500 ký tự.').optional().nullable()
    }).optional()
}).superRefine((data, ctx) => {
    if (data.role !== 'Candidate' || !data.candidate) return;
    const phone = (data.candidate.phone || '').trim();
    if (phone && !VN_PHONE_REGEX.test(phone)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['phone'],
            message: 'Số điện thoại phải gồm 10 số hợp lệ tại Việt Nam (VD: 0912345678).'
        });
    }
    if (data.candidate.birthday) {
        const birthDate = new Date(data.candidate.birthday);
        if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['birthday'], message: 'Ngày sinh không hợp lệ.' });
        }
    }
});

const parseOptionalSalary = (val) => (val === '' || val === null || val === undefined ? undefined : Number(val));

export const jobSchema = z.object({
    title: z.string().trim().min(1, 'Vui lòng nhập tiêu đề công việc.').max(200, 'Tiêu đề tối đa 200 ký tự.'),
    locationId: z.any().refine((v) => v !== '' && v !== null && v !== undefined && Number(v) > 0, {
        message: 'Vui lòng chọn khu vực làm việc.'
    }),
    salaryMin: z.any().optional(),
    salaryMax: z.any().optional(),
    deadline: z.string().optional().nullable()
}).superRefine((data, ctx) => {
    const minVal = parseOptionalSalary(data.salaryMin);
    const maxVal = parseOptionalSalary(data.salaryMax);
    const minBad = minVal !== undefined && (Number.isNaN(minVal) || minVal < 0 || minVal > 999);
    const maxBad = maxVal !== undefined && (Number.isNaN(maxVal) || maxVal < 0 || maxVal > 999);

    if (minBad) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['salaryMin'], message: 'Lương tối thiểu phải từ 0 đến 999 triệu.' });
    if (maxBad) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['salaryMax'], message: 'Lương tối đa phải từ 0 đến 999 triệu.' });
    if (minVal !== undefined && maxVal !== undefined && !minBad && !maxBad && minVal > maxVal) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['salaryMax'], message: 'Lương Max phải lớn hơn hoặc bằng Lương Min.' });
    }
    if (data.deadline && Number.isNaN(Date.parse(data.deadline))) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['deadline'], message: 'Ngày hết hạn không hợp lệ.' });
    }
});

const runZod = (schema, data) => {
    const parsed = schema.safeParse(data);
    return parsed.success ? { isValid: true, errors: {} } : zodToErrors(parsed.error);
};

export const validateLoginForm = (data = {}) => runZod(loginSchema, { email: data.email || '', password: data.password || '' });
export const validateRegisterForm = (data = {}) => runZod(registerSchema, {
    fullName: data.fullName || '', email: data.email || '', password: data.password || '',
    confirmPassword: data.confirmPassword || '', role: data.role || ''
});
export const validateCompanyForm = (data = {}) => runZod(companySchema, data);
export const validateProfileForm = (data = {}) => runZod(profileSchema, { ...data, fullName: data.fullName || '' });
export const validateJobForm = (data = {}) => runZod(jobSchema, { ...data, title: data.title || '' });
