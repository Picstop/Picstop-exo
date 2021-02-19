/* eslint-disable class-methods-use-this */
import { Response } from 'express';
import Album from '../models/album';
import { NewRequest as Request } from '../types/types';
import initLogger from '../core/logger';

const logger = initLogger('MiddlewareAlbuums');

export default class AlbumMiddleware {

}
