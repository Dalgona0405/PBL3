using FluentValidation;
using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Validators
{
    public class CreateCompanyDTOValidator : AbstractValidator<CreateCompanyDTO>
    {
        public CreateCompanyDTOValidator()
        {
            RuleFor(x => x.CompanyName)
                .NotEmpty().WithMessage("Tên doanh nghiệp không được để trống.")
                .MaximumLength(200).WithMessage("Tên doanh nghiệp tối đa 200 ký tự.");

            RuleFor(x => x.Website)
                .MaximumLength(255).When(x => !string.IsNullOrWhiteSpace(x.Website))
                .WithMessage("Đường dẫn website tối đa 255 ký tự.");

            RuleFor(x => x.TaxCode)
                .MaximumLength(50).When(x => !string.IsNullOrWhiteSpace(x.TaxCode))
                .WithMessage("Mã số thuế tối đa 50 ký tự.");
        }
    }

    public class UpdateCompanyDTOValidator : AbstractValidator<UpdateCompanyDTO>
    {
        public UpdateCompanyDTOValidator()
        {
            RuleFor(x => x.CompanyName)
                .NotEmpty().When(x => x.CompanyName != null)
                .MaximumLength(200).WithMessage("Tên doanh nghiệp tối đa 200 ký tự.");

            RuleFor(x => x.TaxCode)
                .MaximumLength(50).When(x => !string.IsNullOrWhiteSpace(x.TaxCode))
                .WithMessage("Mã số thuế tối đa 50 ký tự.");
        }
    }

    public class CreateApplicationDTOValidator : AbstractValidator<CreateApplicationDTO>
    {
        public CreateApplicationDTOValidator()
        {
            RuleFor(x => x.JobId)
                .GreaterThan(0).WithMessage("Mã công việc ứng tuyển không hợp lệ.");
        }
    }

    public class UpdateApplicationStatusDTOValidator : AbstractValidator<UpdateApplicationStatusDTO>
    {
        public UpdateApplicationStatusDTOValidator()
        {
            RuleFor(x => x.Status)
                .InclusiveBetween(1, 6).WithMessage("Trạng thái Pipeline không hợp lệ (chỉ chấp nhận từ 1 đến 6).");

            RuleFor(x => x)
                .Must(x => !x.InterviewTime.HasValue || !x.InterviewEndTime.HasValue || x.InterviewEndTime > x.InterviewTime)
                .WithMessage("Thời gian kết thúc phỏng vấn phải sau thời gian bắt đầu.");
        }
    }

    public class SendMessageDTOValidator : AbstractValidator<SendMessageDTO>
    {
        public SendMessageDTOValidator()
        {
            RuleFor(x => x.ReceiverId)
                .GreaterThan(0).WithMessage("Người nhận tin nhắn không hợp lệ.");

            RuleFor(x => x.Content)
                .NotEmpty().WithMessage("Nội dung tin nhắn không được để trống.")
                .MaximumLength(4000).WithMessage("Nội dung tin nhắn tối đa 4000 ký tự.");
        }
    }

    public class CreateTagDTOValidator : AbstractValidator<CreateTagDTO>
    {
        public CreateTagDTOValidator()
        {
            RuleFor(x => x.TagName)
                .NotEmpty().WithMessage("Tên nhãn kỹ năng không được để trống.")
                .MaximumLength(100).WithMessage("Tên nhãn kỹ năng tối đa 100 ký tự.");
        }
    }

    public class UpdateTagDTOValidator : AbstractValidator<UpdateTagDTO>
    {
        public UpdateTagDTOValidator()
        {
            RuleFor(x => x.TagName)
                .NotEmpty().When(x => x.TagName != null)
                .MaximumLength(100).WithMessage("Tên nhãn kỹ năng tối đa 100 ký tự.");
        }
    }

    public class CreateLocationDTOValidator : AbstractValidator<CreateLocationDTO>
    {
        public CreateLocationDTOValidator()
        {
            RuleFor(x => x.LocationName)
                .NotEmpty().WithMessage("Tên địa điểm không được để trống.")
                .MaximumLength(100).WithMessage("Tên địa điểm tối đa 100 ký tự.");
        }
    }

    public class UpdateLocationDTOValidator : AbstractValidator<UpdateLocationDTO>
    {
        public UpdateLocationDTOValidator()
        {
            RuleFor(x => x.LocationName)
                .NotEmpty().When(x => x.LocationName != null)
                .MaximumLength(100).WithMessage("Tên địa điểm tối đa 100 ký tự.");
        }
    }
}
