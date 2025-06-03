import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsAtLeastOne(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAtLeastOne',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(_value: any, args: ValidationArguments) {
          const obj = args.object as any;
          return obj.plateId !== undefined || 
                 obj.beverageId !== undefined || 
                 obj.dessertId !== undefined;
        },
        defaultMessage() {
          return 'Pelo menos um item (prato, bebida ou sobremesa) deve ser selecionado';
        },
      },
    });
  };
}
